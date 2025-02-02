# Generated by Django 3.2.19 on 2023-05-30 12:09

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0103_billingv2entry_date_charged'),
    ]

    operations = [
        migrations.AlterField(
            model_name='irtaskform',
            name='instance_resource',
            field=models.OneToOneField(db_column='INSTANCE_RESOURCE_ID', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='ir_taskform', serialize=False, to='core.instanceresource'),
        ),
    ]
